# Task: gen-ll-reverse_list-4667 | Score: 100% | 2026-02-14T12:28:09.458083

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))