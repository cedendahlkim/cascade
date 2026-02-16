# Task: gen-rec-sum_digits-2866 | Score: 100% | 2026-02-13T12:12:55.522933

x = int(input())
while x >= 10:
    x = sum(int(d) for d in str(x))
print(x)