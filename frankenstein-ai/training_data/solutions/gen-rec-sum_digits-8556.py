# Task: gen-rec-sum_digits-8556 | Score: 100% | 2026-02-14T12:20:54.821008

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)