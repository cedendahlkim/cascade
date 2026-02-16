# Task: gen-numtheory-digit_sum-2712 | Score: 100% | 2026-02-13T16:07:06.601793

n = int(input())
print(sum(int(d) for d in str(abs(n))))