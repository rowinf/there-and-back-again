import { useEffect } from "react"

const FetchJson = ({onSuccess, url}) => {
  useEffect(() => {
    fetch(url).then(async res => {
      let payload = await res.json()
      if (res.status === 200) {
        onSuccess(payload)
      }
    })
  }, [onSuccess, url])
  return null
}

export {FetchJson}
