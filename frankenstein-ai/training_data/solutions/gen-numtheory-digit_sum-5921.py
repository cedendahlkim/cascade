# Task: gen-numtheory-digit_sum-5921 | Score: 100% | 2026-02-13T12:25:55.346133

n = int(input())
print(sum(int(d) for d in str(abs(n))))