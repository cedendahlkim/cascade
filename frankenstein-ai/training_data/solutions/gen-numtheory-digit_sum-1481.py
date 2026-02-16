# Task: gen-numtheory-digit_sum-1481 | Score: 100% | 2026-02-15T07:58:50.630032

n = int(input())
print(sum(int(d) for d in str(abs(n))))