# Task: gen-numtheory-digit_sum-5576 | Score: 100% | 2026-02-13T11:35:20.815814

n = int(input())
print(sum(int(d) for d in str(abs(n))))