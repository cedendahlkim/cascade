# Task: gen-numtheory-digit_sum-5529 | Score: 100% | 2026-02-13T19:35:37.334217

n = int(input())
print(sum(int(d) for d in str(abs(n))))