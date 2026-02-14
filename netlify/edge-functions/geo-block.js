export default async (request, context) => {
  const country = context.geo?.country?.code;

  // Se não for Brasil, bloqueia
  if (country !== "BR") {
    return new Response(
      `
      <html>
        <head>
          <title>Acesso Bloqueado</title>
        </head>
        <body style="
          margin:0;
          background:#0f1419;
          color:white;
          display:flex;
          align-items:center;
          justify-content:center;
          height:100vh;
          font-family:Arial, sans-serif;
          text-align:center;
        ">
          <div>
            <h1>Acesso Bloqueado</h1>
            <p>Este sistema está disponível apenas no território brasileiro.</p>
          </div>
        </body>
      </html>
      `,
      {
        status: 403,
        headers: { "Content-Type": "text/html" }
      }
    );
  }

  // Se for Brasil, deixa continuar
  return context.next();
};
