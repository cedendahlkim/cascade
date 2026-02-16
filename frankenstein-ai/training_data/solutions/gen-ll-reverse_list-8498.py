# Task: gen-ll-reverse_list-8498 | Score: 100% | 2026-02-13T18:50:55.724089

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))