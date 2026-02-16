# Task: gen-ds-reverse_with_stack-5673 | Score: 100% | 2026-02-13T21:08:20.815383

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))