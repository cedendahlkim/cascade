# Task: gen-ds-reverse_with_stack-8771 | Score: 100% | 2026-02-13T17:11:45.476042

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))