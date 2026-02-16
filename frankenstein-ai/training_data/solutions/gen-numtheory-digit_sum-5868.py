# Task: gen-numtheory-digit_sum-5868 | Score: 100% | 2026-02-12T14:15:44.653876

n = input()
s = 0
for digit in n:
    s += int(digit)
print(s)