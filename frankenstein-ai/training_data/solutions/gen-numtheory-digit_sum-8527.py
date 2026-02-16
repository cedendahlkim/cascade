# Task: gen-numtheory-digit_sum-8527 | Score: 100% | 2026-02-12T18:49:26.060247

n = input()
sum_of_digits = 0
for digit in n:
  sum_of_digits += int(digit)
print(sum_of_digits)