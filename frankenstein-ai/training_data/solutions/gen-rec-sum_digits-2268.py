# Task: gen-rec-sum_digits-2268 | Score: 100% | 2026-02-13T09:34:35.541613

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)