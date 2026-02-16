# Task: gen-rec-sum_digits-2923 | Score: 100% | 2026-02-14T12:08:12.344516

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)