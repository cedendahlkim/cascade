# Task: gen-numtheory-digit_sum-8423 | Score: 100% | 2026-02-12T12:41:40.563867

n = input()
s = 0
for digit in n:
  s += int(digit)
print(s)