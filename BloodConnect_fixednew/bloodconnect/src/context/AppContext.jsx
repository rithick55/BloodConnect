import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "bloodconnect-state-v2";

const initialState = {
  users: [
    {
      id: "donor-demo",
      role: "donor",
      name: "Arun Kumar",
      email: "arun@bloodconnect.com",
      phone: "9876543210",
      password: "demo123",
      bloodGroup: "O+",
      state: "Tamil Nadu",
      district: "Coimbatore",
      available: true,
      donations: 12,
    },
    {
      id: "receiver-demo",
      role: "receiver",
      name: "Karthik Kumar",
      email: "karthik@bloodconnect.com",
      phone: "9876543211",
      password: "demo123",
      state: "Tamil Nadu",
      district: "Chennai",
    },
  ],

  donors: [
    {
      id: "donor-demo",
      name: "Arun Kumar",
      phone: "9876543210",
      bloodGroup: "O+",
      state: "Tamil Nadu",
      district: "Coimbatore",
      latitude: 11.0168,
      longitude: 76.9558,
      available: true,
      donations: 12,
    },

    {
      id: "donor-2",
      name: "Karthik",
      phone: "9876543211",
      bloodGroup: "O+",
      state: "Tamil Nadu",
      district: "Chennai",
      latitude: 13.0827,
      longitude: 80.2707,
      available: true,
      donations: 8,
    },

    {
      id: "donor-3",
      name: "Rahul",
      phone: "9876543212",
      bloodGroup: "O+",
      state: "Tamil Nadu",
      district: "Chennai",
      latitude: 13.0674,
      longitude: 80.2376,
      available: false,
      donations: 5,
    },

    {
      id: "donor-4",
      name: "Vignesh",
      phone: "9876543213",
      bloodGroup: "O+",
      state: "Tamil Nadu",
      district: "Chengalpattu",
      latitude: 12.6819,
      longitude: 79.9888,
      available: true,
      donations: 10,
    },

    {
      id: "donor-5",
      name: "Suresh",
      phone: "9876543214",
      bloodGroup: "A+",
      state: "Tamil Nadu",
      district: "Chennai",
      latitude: 13.0500,
      longitude: 80.2200,
      available: true,
      donations: 6,
    },

    {
      id: "donor-6",
      name: "Prakash",
      phone: "9876543215",
      bloodGroup: "B+",
      state: "Tamil Nadu",
      district: "Chennai",
      latitude: 13.1000,
      longitude: 80.2500,
      available: true,
      donations: 4,
    },

    {
      id: "donor-7",
      name: "Vijay",
      phone: "9876543216",
      bloodGroup: "O+",
      state: "Tamil Nadu",
      district: "Chennai",
      latitude: 13.0400,
      longitude: 80.2300,
      available: true,
      donations: 7,
    },
  ],

  requests: [
    {
      id: "request-demo-1",
      receiverId: "receiver-demo",
      patientName: "Rahul",
      patientAge: 28,
      bloodGroup: "O+",
      state: "Tamil Nadu",
      district: "Chennai",
      hospitalName: "Apollo Hospital",
      hospitalAddress: "Chennai",
      locationType: "address",
      location: "Chennai",
      status: "active",
      urgent: true,
      acceptedBy: null,
      createdAt: "2026-08-13T10:00:00.000Z",
    },

    {
      id: "request-demo-2",
      receiverId: "receiver-demo",
      patientName: "Karthik",
      patientAge: 34,
      bloodGroup: "O+",
      state: "Tamil Nadu",
      district: "Chennai",
      hospitalName: "MIOT Hospital",
      hospitalAddress: "Chennai",
      locationType: "address",
      location: "Chennai",
      status: "active",
      urgent: false,
      acceptedBy: null,
      createdAt: "2026-08-12T10:00:00.000Z",
    },
  ],

  messages: {},
  session: null,
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    const sharedState = saved
      ? JSON.parse(saved)
      : initialState;

    const session = JSON.parse(
      sessionStorage.getItem("bloodconnect-session") || "null"
    );

    return {
      ...initialState,
      ...sharedState,
      session,
    };
  } catch {
    return {
      ...initialState,
      session: null,
    };
  }
}

const AppContext = createContext(null);

export function AppProvider({ children }) {

  // JWT headers
  const authHeaders = () => {
    const token = localStorage.getItem("bloodconnect_token");

    return {
      "Content-Type": "application/json",

      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
    };
  };

  const [state, setState] = useState(loadState);

  // Save state whenever it changes
  useEffect(() => {
    const { session, ...sharedState } = state;

    // Shared between tabs
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sharedState)
    );

    // Login session belongs only to this tab
    if (session) {
      sessionStorage.setItem(
        "bloodconnect-session",
        JSON.stringify(session)
      );
    } else {
      sessionStorage.removeItem("bloodconnect-session");
    }
  }, [state]);

  // Sync changes from another browser tab
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const latestState = JSON.parse(event.newValue);

        setState((current) => ({
          ...current,
          ...latestState,
          session: current.session,
        }));
      } catch (error) {
        console.error(
          "Unable to sync BloodConnect state:",
          error
        );
      }
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  const addRegisteredUser = (user) => {
    if (!user) return;

    const role = user.role?.toLowerCase();

    const newUser = {
      ...user,
      role,
    };

    setState((current) => {
      const alreadyExists = current.users.some(
        (item) =>
          item.email?.toLowerCase() ===
          user.email?.toLowerCase()
      );

      if (alreadyExists) {
        return current;
      }

      let donors = current.donors;

      if (role === "donor") {
        donors = [
          ...current.donors,
          {
            ...newUser,
            latitude: null,
            longitude: null,
            available: true,
            donations: 0,
          },
        ];
      }

      return {
        ...current,
        users: [...current.users, newUser],
        donors,
      };
    });
  };

  const register = (user) => {
    const email = user.email.trim().toLowerCase();

    if (
      state.users.some(
        (item) => item.email.toLowerCase() === email
      )
    ) {
      return {
        ok: false,
        error: "An account with this email already exists.",
      };
    }

    const id = `${user.role}-${Date.now()}`;

    const newUser = {
      ...user,
      id,
      email,
    };

    setState((current) => ({
      ...current,

      users: [
        ...current.users,
        newUser,
      ],

      donors:
        newUser.role === "donor"
          ? [
            ...current.donors,
            {
              ...newUser,
              latitude: null,
              longitude: null,
              available: true,
              donations: 0,
            },
          ]
          : current.donors,
    }));

    return {
      ok: true,
      user: newUser,
    };
  };

  const login = (email, password, role) => {
    const user = state.users.find(
      (item) =>
        item.email.toLowerCase() ===
        email.trim().toLowerCase() &&
        item.password === password &&
        item.role === role
    );

    if (!user) {
      return {
        ok: false,
        error: "Invalid email or password.",
      };
    }

    setState((current) => ({
      ...current,
      session: {
        userId: user.id,
        role: user.role,
      },
    }));

    return {
      ok: true,
      user,
    };
  };

  const loginWithBackendUser = (user) => {
    if (!user) return;

    const role = user.role.toLowerCase();

    setState((current) => {
      const existingUser = current.users.find(
        (item) =>
          item.email.toLowerCase() ===
          user.email.toLowerCase()
      );

      const syncedUser = {
        ...(existingUser || {}),
        ...user,
        id: user.id,
        role,
        email: user.email,
        name: user.name,
      };

      const users = existingUser
        ? current.users.map((item) =>
          item.email.toLowerCase() ===
            user.email.toLowerCase()
            ? syncedUser
            : item
        )
        : [
          ...current.users,
          syncedUser,
        ];

      let donors = current.donors;

      if (role === "donor") {
        const existingDonor = current.donors.find(
          (item) =>
            item.id === user.id ||
            item.email?.toLowerCase() ===
            user.email?.toLowerCase()
        );

        const syncedDonor = {
          ...(existingDonor || {}),
          ...user,
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          bloodGroup: user.bloodGroup,
          state: user.state,
          district: user.district,
          latitude:
            existingDonor?.latitude ?? null,
          longitude:
            existingDonor?.longitude ?? null,
          available:
            existingDonor?.available ?? true,
          donations:
            existingDonor?.donations ?? 0,
        };

        donors = existingDonor
          ? current.donors.map((item) =>
            item.id === existingDonor.id
              ? syncedDonor
              : item
          )
          : [
            ...current.donors,
            syncedDonor,
          ];
      }

      return {
        ...current,
        users,
        donors,
        session: {
          userId: user.id,
          role,
        },
      };
    });
  };

  const adminLogin = (email, password) => {
    if (
      email.trim().toLowerCase() !==
      "admin@bloodconnect.com" ||
      password !== "admin123"
    ) {
      return {
        ok: false,
        error: "Invalid admin email or password.",
      };
    }

    setState((current) => ({
      ...current,
      session: {
        userId: "admin",
        role: "admin",
      },
    }));

    return {
      ok: true,
    };
  };

  const logout = () => {
  localStorage.removeItem("bloodconnect_token");
  localStorage.removeItem("bloodconnect_user");

  setState((current) => ({
    ...current,
    session: null,
  }));
};

  const currentUser = useMemo(() => {
    if (!state.session) return null;

    return (
      state.users.find(
        (user) =>
          user.id === state.session.userId
      ) || null
    );
  }, [state.session, state.users]);

  // Create blood request
  const createRequest = async (request) => {
    if (!currentUser) {
      throw new Error(
        "Receiver session not found."
      );
    }

    const response = await fetch(
      `http://localhost:8090/api/requests?receiverId=${currentUser.id}`,
      {
        method: "POST",

        headers: authHeaders(),

        body: JSON.stringify({
          patientName: request.patientName,
          patientAge: request.patientAge,
          bloodGroup: request.bloodGroup,
          state: request.state,
          district: request.district,
          hospitalName: request.hospitalName,
          hospitalAddress: request.hospitalAddress,
          locationType: request.locationType,
          location: request.location,
          urgent: Boolean(request.urgent),
        }),
      }
    );

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        message: text,
      };
    }

    if (!response.ok) {
      throw new Error(
        data.message ||
        "Unable to create blood request."
      );
    }

    const newRequest = {
      ...request,
      ...data,
      id: data.id,
      receiverId: currentUser.id,
      status:
        data.status?.toLowerCase() ||
        "active",
      acceptedBy:
        data.acceptedBy ?? null,
      urgent: Boolean(data.urgent),
      createdAt:
        data.createdAt ||
        new Date().toISOString(),
    };

    setState((current) => ({
      ...current,

      requests: [
        newRequest,

        ...current.requests.filter(
          (item) =>
            item.id !== newRequest.id
        ),
      ],
    }));

    return newRequest;
  };

  const updateDonorAvailability = (available) => {
    if (
      !currentUser ||
      currentUser.role !== "donor"
    ) {
      return;
    }

    setState((current) => ({
      ...current,

      users: current.users.map((user) =>
        user.id === currentUser.id
          ? {
            ...user,
            available,
          }
          : user
      ),

      donors: current.donors.map((donor) =>
        donor.id === currentUser.id
          ? {
            ...donor,
            available,
          }
          : donor
      ),
    }));
  };

  const updateDonorAvailabilityById = (
    donorId,
    available
  ) => {
    setState((current) => ({
      ...current,

      donors: current.donors.map((donor) =>
        donor.id === donorId
          ? {
            ...donor,
            available,
          }
          : donor
      ),

      users: current.users.map((user) =>
        user.id === donorId
          ? {
            ...user,
            available,
          }
          : user
      ),
    }));
  };

  const updateUserStatus = (
    userId,
    status
  ) => {
    setState((current) => ({
      ...current,

      users: current.users.map((user) =>
        user.id === userId
          ? {
            ...user,
            status,
          }
          : user
      ),
    }));
  };

  // Load active requests
  const loadActiveRequests = async () => {
    try {
      const response = await fetch(
        "http://localhost:8090/api/requests/active",
        {
          headers: authHeaders(),
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          message: text,
        };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to load active requests."
        );
      }

      const backendRequests =
        data.map((request) => ({
          ...request,
          status:
            request.status?.toLowerCase() ||
            "active",
          urgent: Boolean(request.urgent),
          acceptedBy:
            request.acceptedBy ?? null,
        }));

      setState((current) => ({
        ...current,
        requests: backendRequests,
      }));

      return backendRequests;

    } catch (error) {
      console.error(
        "Unable to load active requests:",
        error
      );

      throw error;
    }
  };

  // Accept blood request
  const acceptRequest = async (
    requestId
  ) => {
    if (
      !currentUser ||
      currentUser.role !== "donor"
    ) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8090/api/requests/${requestId}/accept?donorId=${currentUser.id}`,
        {
          method: "PUT",
          headers: authHeaders(),
        }
      );

      const text =
        await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          message: text,
        };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to accept blood request."
        );
      }

      const acceptedRequest = {
        ...data,
        id: data.id,
        receiverId: data.receiverId,
        status:
          data.status?.toLowerCase() ||
          "accepted",
        acceptedBy:
          data.acceptedBy ??
          currentUser.id,
        urgent: Boolean(data.urgent),
        createdAt: data.createdAt,
      };

      setState((current) => ({
        ...current,

        requests:
          current.requests.map(
            (request) =>
              request.id === requestId
                ? {
                  ...request,
                  ...acceptedRequest,
                }
                : request
          ),
      }));

      return acceptedRequest;

    } catch (error) {
      console.error(
        "Unable to accept request:",
        error
      );

      throw error;
    }
  };

  const updateDonorLocation = (
    latitude,
    longitude
  ) => {
    if (
      !currentUser ||
      currentUser.role !== "donor"
    ) {
      return;
    }

    setState((current) => ({
      ...current,

      users: current.users.map(
        (user) =>
          user.id === currentUser.id
            ? {
              ...user,
              latitude,
              longitude,
            }
            : user
      ),

      donors: current.donors.map(
        (donor) =>
          donor.id === currentUser.id
            ? {
              ...donor,
              latitude,
              longitude,
            }
            : donor
      ),
    }));
  };

  const getRequest = (id) =>
    state.requests.find(
      (request) =>
        request.id === id
    ) || null;

  const openChat = (
    requestId,
    donorId = null
  ) => {
    if (!requestId) return;

    setState((current) => ({
      ...current,

      requests:
        current.requests.map(
          (request) =>
            request.id === requestId
              ? {
                ...request,
                chatDonorId:
                  donorId ||
                  request.chatDonorId ||
                  request.acceptedBy ||
                  null,
              }
              : request
        ),
    }));
  };

  const addMessage = (
    requestId,
    text,
    sender =
      currentUser?.role || "donor"
  ) => {
    if (
      !requestId ||
      !text.trim()
    ) {
      return;
    }

    const item = {
      id: `${Date.now()}-${Math.random()}`,
      sender,
      text: text.trim(),
      time: new Date().toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
    };

    setState((current) => ({
      ...current,

      messages: {
        ...current.messages,

        [requestId]: [
          ...(current.messages[
            requestId
          ] || []),
          item,
        ],
      },
    }));
  };

  // Update user profile
  const updateUser = async (
    updates
  ) => {
    if (!currentUser) return;

    try {
      const response = await fetch(
        `http://localhost:8090/api/auth/profile/${currentUser.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name: updates.name,
            phone: updates.phone,
            bloodGroup:
              updates.bloodGroup,
            state: updates.state,
            district:
              updates.district,
          }),
        }
      );

      const text =
        await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = {
          message: text,
        };
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Unable to update profile."
        );
      }

      const updatedUser = {
        ...currentUser,

        id: data.id,
        name: data.name,
        email: data.email,

        role:
          data.role?.toLowerCase() ||
          currentUser.role,

        phone: data.phone,
        bloodGroup:
          data.bloodGroup,
        state: data.state,
        district: data.district,
        available:
          data.available,
        donations:
          data.donations,
      };

      setState((current) => ({
        ...current,

        users:
          current.users.map(
            (user) =>
              user.id ===
                currentUser.id
                ? {
                  ...user,
                  ...updatedUser,
                }
                : user
          ),

        donors:
          current.donors.map(
            (donor) =>
              donor.id ===
                currentUser.id
                ? {
                  ...donor,
                  ...updatedUser,
                }
                : donor
          ),
      }));

      return updatedUser;

    } catch (error) {
      console.error(
        "Unable to update profile:",
        error
      );

      throw error;
    }
  };

  const value = {
    ...state,

    currentUser,

    register,
    addRegisteredUser,
    login,
    loginWithBackendUser,
    adminLogin,
    logout,

    createRequest,
    loadActiveRequests,

    updateDonorAvailability,
    updateDonorAvailabilityById,
    updateDonorLocation,
    updateUserStatus,

    acceptRequest,

    getRequest,
    openChat,
    addMessage,

    updateUser,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context =
    useContext(AppContext);

  if (!context) {
    throw new Error(
      "useApp must be used inside AppProvider"
    );
  }

  return context;
}