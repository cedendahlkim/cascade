# Task: gen-rec-sum_digits-4545 | Score: 100% | 2026-02-13T09:12:21.276357

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)