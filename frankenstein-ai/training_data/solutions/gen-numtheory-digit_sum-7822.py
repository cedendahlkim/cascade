# Task: gen-numtheory-digit_sum-7822 | Score: 100% | 2026-02-12T14:12:59.467795

n = int(input())
siffersumma = 0
while n > 0:
    siffersumma += n % 10
    n //= 10
print(siffersumma)