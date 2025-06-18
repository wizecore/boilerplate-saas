// Inspired by react-hot-toast library
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
  ToastVariant,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode,
  icon?: React.ReactNode,
  description?: React.ReactNode
  action?: ToastActionElement,
  timeout?: number,
  className?: string,
  variant?: ToastVariant
}

/** eslint-disable-next-line unused-imports/no-unused-vars */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
  HIDE_TOAST: "HIDE_TOAST"
} as const

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type ActionType = typeof actionTypes

type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId: ToasterToast["id"],
      timeout?: number
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId: ToasterToast["id"]
    }
  | {
      type: ActionType["HIDE_TOAST"]
      toastId: ToasterToast["id"]
    }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToDismissQueue = (toastId: string, timeoutMs?: number) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const delay = timeoutMs ?? TOAST_REMOVE_DELAY
  const timeout = setTimeout(() => {
    if (toastTimeouts.delete(toastId)) {
      // If was not removed
      dispatch({
        type: "HIDE_TOAST",
        toastId: toastId,
      })
    }
  }, delay)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? {
            ...t,
            ...action.toast,
            // Update opens it
            open: true
           } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToDismissQueue(toastId, action.timeout)
      } else {
        state.toasts.forEach((toast) => {
          addToDismissQueue(toast.id, toast.timeout)
        })
      }

      return state
    }

    case "HIDE_TOAST": {
      const { toastId } = action
      return {
        ...state,
        toasts: state.toasts.map((t) => t.id === toastId ? ({
          ...t,
          open: false 
        }) : t),
      }
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }

      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

const listeners: Array<(state: State) => void> = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
  const id = genId()

  // Updates the toast with new props, and resets the timeout
  const update = (props: Omit<ToasterToast, "id">) => {
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })

    if (props.timeout !== -1) {
      dispatch({ type: "DISMISS_TOAST", toastId: id, timeout: props.timeout });
    } else {
      // If there was a timeout to dismiss it, remove timeout so it will 
      // not be dismissed
      toastTimeouts.delete(id)
    }
  }

  // Dismisses it but calling update will show it again (for a new timeout if any)
  const dismiss = () => {
    dispatch({ type: "HIDE_TOAST", toastId: id })
  }

  // Removes toast completely
  const remove = () => {
    dispatch({ type: "REMOVE_TOAST", toastId: id })
  }

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) {
            dismiss()
        }
      },
    },
  })

  if (props.timeout !== -1) {
    dispatch({ type: "DISMISS_TOAST", toastId: id, timeout: props.timeout });
  }

  return {
    id: id,
    dismiss,
    update,
    remove
  }
}

export type ToastReference = ReturnType<typeof toast>;

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }
