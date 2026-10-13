import "./boton_generico.css";

// La prop 'children' representa todo lo que se pone entre <BotonGenerico> y </BotonGenerico>
function BotonGenerico({ children, onClick, className = "", type, disabled, ...rest }) {
  return (
    <button
      type={type || "button"}
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...rest}
    >
      {children}
    </button>
  );
}

export default BotonGenerico;