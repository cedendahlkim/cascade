# Task: gen-numtheory-digit_sum-1781 | Score: 100% | 2026-02-12T12:10:38.648332

n = input()
sum_digits = 0
for digit in n:
  sum_digits += int(digit)
print(sum_digits)