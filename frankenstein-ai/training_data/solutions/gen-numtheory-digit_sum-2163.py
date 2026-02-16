# Task: gen-numtheory-digit_sum-2163 | Score: 100% | 2026-02-13T12:04:13.687461

n = int(input())
print(sum(int(d) for d in str(abs(n))))