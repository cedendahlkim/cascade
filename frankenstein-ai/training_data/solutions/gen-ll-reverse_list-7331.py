# Task: gen-ll-reverse_list-7331 | Score: 100% | 2026-02-13T12:21:50.704297

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))