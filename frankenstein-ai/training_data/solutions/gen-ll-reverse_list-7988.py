# Task: gen-ll-reverse_list-7988 | Score: 100% | 2026-02-15T09:51:47.140983

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))