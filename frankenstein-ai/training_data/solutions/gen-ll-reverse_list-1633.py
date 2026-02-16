# Task: gen-ll-reverse_list-1633 | Score: 100% | 2026-02-13T18:20:52.907720

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))