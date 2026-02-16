# Task: gen-ll-reverse_list-2479 | Score: 100% | 2026-02-13T12:27:08.092455

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))