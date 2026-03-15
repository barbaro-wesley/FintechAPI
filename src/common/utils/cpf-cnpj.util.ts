export function validateCpfCnpj(value: string): boolean {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length === 11) return validateCpf(cleaned)
  if (cleaned.length === 14) return validateCnpj(cleaned)
  return false
}

function validateCpf(cpf: string): boolean {
  if (/^(\d)\1+$/.test(cpf)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(cpf[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  return remainder === parseInt(cpf[10])
}

function validateCnpj(cnpj: string): boolean {
  if (/^(\d)\1+$/.test(cnpj)) return false
  const calcDigit = (cnpj: string, len: number) => {
    let sum = 0, pos = len - 7
    for (let i = len; i >= 1; i--) {
      sum += parseInt(cnpj[len - i]) * pos--
      if (pos < 2) pos = 9
    }
    const result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
    return result
  }
  return (
    calcDigit(cnpj, 12) === parseInt(cnpj[12]) &&
    calcDigit(cnpj, 13) === parseInt(cnpj[13])
  )
}
