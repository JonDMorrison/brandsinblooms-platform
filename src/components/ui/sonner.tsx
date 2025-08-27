import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "light" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        style: {
          background: 'white',
          color: 'black',
          border: '1px solid #e5e5e5',
        },
        classNames: {
          toast: "!bg-white !text-black !border !border-gray-300 shadow-lg",
          description: "!text-gray-600",
          actionButton: "!bg-black !text-white",
          cancelButton: "!bg-gray-100 !text-gray-900",
        },
        ...props.toastOptions
      }}
      {...props}
    />
  )
}

export { Toaster }
