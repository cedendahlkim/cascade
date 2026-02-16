# Task: gen-ll-reverse_list-4822 | Score: 100% | 2026-02-14T13:12:11.649098

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))