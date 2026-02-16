# Task: gen-ll-reverse_list-7382 | Score: 100% | 2026-02-13T20:50:05.160067

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))