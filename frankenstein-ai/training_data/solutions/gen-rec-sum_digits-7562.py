# Task: gen-rec-sum_digits-7562 | Score: 100% | 2026-02-13T12:04:16.123166

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)