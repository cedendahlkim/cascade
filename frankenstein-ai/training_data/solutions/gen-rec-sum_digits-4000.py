# Task: gen-rec-sum_digits-4000 | Score: 100% | 2026-02-15T07:53:42.573480

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)