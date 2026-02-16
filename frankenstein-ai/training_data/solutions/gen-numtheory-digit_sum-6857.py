# Task: gen-numtheory-digit_sum-6857 | Score: 100% | 2026-02-13T14:01:23.238791

n = int(input())
print(sum(int(d) for d in str(abs(n))))