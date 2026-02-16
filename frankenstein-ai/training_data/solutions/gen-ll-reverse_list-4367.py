# Task: gen-ll-reverse_list-4367 | Score: 100% | 2026-02-14T12:09:06.053713

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))