# Task: gen-ll-reverse_list-8555 | Score: 100% | 2026-02-14T12:03:05.446629

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))