# Task: gen-math-modular_exp-4511 | Score: 100% | 2026-02-15T09:50:46.703446

def modular_exponentiation(base, exponent, modulus):
    result = 1
    base = base % modulus
    while exponent > 0:
        if exponent % 2 == 1:
            result = (result * base) % modulus
        base = (base * base) % modulus
        exponent //= 2
    return result

base, exponent, modulus = map(int, input().split())
print(modular_exponentiation(base, exponent, modulus))