# Task: gen-ll-reverse_list-7466 | Score: 100% | 2026-02-14T12:37:00.517974

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))