# Task: gen-numtheory-digit_sum-4221 | Score: 100% | 2026-02-12T20:27:07.236604

n = input()
sum_digits = 0
for digit in n:
  sum_digits += int(digit)
print(sum_digits)