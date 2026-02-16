# Task: gen-ll-reverse_list-9833 | Score: 100% | 2026-02-15T11:37:46.580572

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))