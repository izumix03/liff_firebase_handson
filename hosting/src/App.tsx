import React from 'react';

export const App = () => {
  const [user] = useUser();

  return (
    <>
      { user? (<p>認証完了</p>) : (<p>未認証</p>) }
    </>
  )
}