# Task: gen-math-modular_exp-1704 | Score: 100% | 2026-02-15T08:24:38.843817

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