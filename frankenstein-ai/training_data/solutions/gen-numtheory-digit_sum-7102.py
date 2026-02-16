# Task: gen-numtheory-digit_sum-7102 | Score: 100% | 2026-02-12T20:53:49.966436

n = input()
sum_digits = 0
for digit in n:
    sum_digits += int(digit)
print(sum_digits)