function Input({ name, label, handleOnChange, placeholder = "", value = "", type = "text", ...rest }) {
  const placeholderText = placeholder || String(label).replace(':', '').trim();

  return (
    <>
      <label htmlFor={name}>{label} </label>
      <input
        id={name}
        name={name}
        onChange={handleOnChange}
        placeholder={placeholderText}
        value={value}
        type={type}
        {...rest}
      />
    </>
  );
}

export default Input

/* Exemplo uso
import { useState } from "react";
import Input from "./Input";

function Form() {
  const [email, setEmail] = useState("");

  return (
    <form>
      <Input
        name="email"
        label="Email"
        value={email}
        handleOnChange={(e) => setEmail(e.target.value)}
      />
    </form>
  );
}
*/