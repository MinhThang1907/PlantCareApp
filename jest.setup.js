import "react-native-gesture-handler/jestSetup"

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock")
  Reanimated.default.call = () => {}
  return Reanimated
})

jest.mock("react-native/Libraries/Animated/NativeAnimatedHelper")

jest.mock("@react-native-firebase/app", () => ({
  utils: () => ({
    FilePath: {
      PICTURES_DIRECTORY: "/tmp/",
    },
  }),
}))

jest.mock("@react-native-firebase/auth", () => ({
  __esModule: true,
  default: () => ({
    onAuthStateChanged: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    createUserWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  }),
}))

jest.mock("@react-native-firebase/firestore", () => ({
  __esModule: true,
  default: () => ({
    collection: jest.fn(() => ({
      add: jest.fn(),
      get: jest.fn(),
      doc: jest.fn(() => ({
        update: jest.fn(),
        delete: jest.fn(),
      })),
    })),
  }),
}))
