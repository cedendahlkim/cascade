# Task: gen-bt-sudoku_valid-8566 | Score: 100% | 2026-02-11T12:25:10.107438

def solve_sudoku():
    grid = []
    for _ in range(9):
        grid.append(list(map(int, input().split())))

    def is_valid(board, row, col, num):
        for i in range(9):
            if board[row][i] == num:
                return False
            if board[i][col] == num:
                return False
            if board[3 * (row // 3) + i // 3][3 * (col // 3) + i % 3] == num:
                return False
        return True

    def find_empty(board):
        for i in range(9):
            for j in range(9):
                if board[i][j] == 0:
                    return (i, j)
        return None

    def sudoku_solver(board):
        empty_pos = find_empty(board)
        if not empty_pos:
            return True

        row, col = empty_pos

        for num in range(1, 10):
            if is_valid(board, row, col, num):
                board[row][col] = num

                if sudoku_solver(board):
                    return True

                board[row][col] = 0

        return False
    
    original_grid = [row[:] for row in grid]
    
    if sudoku_solver(grid):
        print("valid")
    else:
        
        rows_valid = True
        for row in original_grid:
            seen = set()
            for num in row:
                if num != 0:
                    if num in seen:
                        rows_valid = False
                        break
                    seen.add(num)
            if not rows_valid:
                break

        cols_valid = True
        for col in range(9):
            seen = set()
            for row in range(9):
                num = original_grid[row][col]
                if num != 0:
                    if num in seen:
                        cols_valid = False
                        break
                    seen.add(num)
            if not cols_valid:
                break
        
        boxes_valid = True
        for box_row in range(3):
            for box_col in range(3):
                seen = set()
                for i in range(3):
                    for j in range(3):
                        num = original_grid[box_row*3 + i][box_col*3 + j]
                        if num != 0:
                            if num in seen:
                                boxes_valid = False
                                break
                            seen.add(num)
                    if not boxes_valid:
                        break
                if not boxes_valid:
                    break
            if not boxes_valid:
                break

        if rows_valid and cols_valid and boxes_valid:
            print("valid")
        else:
            print("invalid")

solve_sudoku()