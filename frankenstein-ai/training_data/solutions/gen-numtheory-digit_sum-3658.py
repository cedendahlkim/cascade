# Task: gen-numtheory-digit_sum-3658 | Score: 100% | 2026-02-12T17:39:51.126903

n = input()
sum_digits = 0
for digit in n:
  sum_digits += int(digit)
print(sum_digits)