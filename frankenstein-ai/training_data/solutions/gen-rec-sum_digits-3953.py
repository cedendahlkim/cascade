# Task: gen-rec-sum_digits-3953 | Score: 100% | 2026-02-15T12:30:10.704154

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)