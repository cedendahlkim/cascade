# Task: gen-numtheory-digit_sum-1247 | Score: 100% | 2026-02-12T18:50:05.438372

n = input()
sum_digits = 0
for digit in n:
    sum_digits += int(digit)
print(sum_digits)