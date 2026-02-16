# Task: gen-rec-sum_digits-7549 | Score: 100% | 2026-02-14T12:20:54.305154

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)