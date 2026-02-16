# Task: gen-ll-reverse_list-1325 | Score: 100% | 2026-02-14T12:04:53.255648

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))